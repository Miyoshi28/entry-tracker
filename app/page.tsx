"use client";

import { useState, useEffect } from "react";

type Status =
  | "エントリー前"
  | "エントリー済み"
  | "書類選考中"
  | "一次面接"
  | "二次面接"
  | "最終面接"
  | "内定"
  | "不採用";

type Progress = "審査中" | "通過";

type DeadlineType = "エントリーシート締め切り" | "1次面接日" | "2次面接日" | "最終面接日";

type Entry = {
  id: string;
  company: string;
  deadlineType: DeadlineType;
  deadline: string; // "YYYY-MM-DDTHH:mm" 形式
  status: Status;
  progress?: Progress;
  submitted: boolean; // ES提出済みかどうか（ES締切以外では使わない）
};

const STATUS_OPTIONS: Status[] = [
  "エントリー前",
  "エントリー済み",
  "書類選考中",
  "一次面接",
  "二次面接",
  "最終面接",
  "内定",
  "不採用",
];

const STATUSES_WITH_PROGRESS: Status[] = [
  "エントリー済み",
  "書類選考中",
  "一次面接",
  "二次面接",
  "最終面接",
];

const PROGRESS_OPTIONS: Progress[] = ["審査中", "通過"];

const DEADLINE_TYPE_OPTIONS: DeadlineType[] = [
  "エントリーシート締め切り",
  "1次面接日",
  "2次面接日",
  "最終面接日",
];

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [company, setCompany] = useState("");
  const [deadlineType, setDeadlineType] = useState<DeadlineType>("エントリーシート締め切り");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [status, setStatus] = useState<Status>("エントリー前");
  const [progress, setProgress] = useState<Progress | "">("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCompany, setEditCompany] = useState("");
  const [editDeadlineType, setEditDeadlineType] = useState<DeadlineType>("エントリーシート締め切り");
  const [editDeadlineDate, setEditDeadlineDate] = useState("");
  const [editDeadlineTime, setEditDeadlineTime] = useState("23:59");
  const [editStatus, setEditStatus] = useState<Status>("エントリー前");
  const [editProgress, setEditProgress] = useState<Progress | "">("");

  useEffect(() => {
    const saved = localStorage.getItem("entries");
    if (saved) {
      setEntries(JSON.parse(saved));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("entries", JSON.stringify(entries));
  }, [entries, isLoaded]);

  const addEntry = () => {
    if (!company || !deadlineDate) return;
    const time = deadlineTime || "23:59";
    const newEntry: Entry = {
      id: crypto.randomUUID(),
      company,
      deadlineType,
      deadline: `${deadlineDate}T${time}`,
      status,
      progress: STATUSES_WITH_PROGRESS.includes(status)
        ? (progress || "審査中")
        : undefined,
      submitted: false, // 追加時は必ず「未」からスタート
    };
    setEntries([...entries, newEntry]);
    setCompany("");
    setDeadlineType("エントリーシート締め切り");
    setDeadlineDate("");
    setDeadlineTime("23:59");
    setStatus("エントリー前");
    setProgress("");
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  // 「提出完了」ボタンを押した時、そのエントリーのsubmittedをtrueにする
  const markSubmitted = (id: string) => {
    setEntries(
      entries.map((e) => (e.id === id ? { ...e, submitted: true } : e))
    );
  };

  const startEdit = (entry: Entry) => {
    setEditingId(entry.id);
    setEditCompany(entry.company);
    setEditDeadlineType(entry.deadlineType);
    const [datePart, timePart] = entry.deadline.split("T");
    setEditDeadlineDate(datePart);
    setEditDeadlineTime(timePart || "23:59");
    setEditStatus(entry.status);
    setEditProgress(entry.progress ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = () => {
    if (!editCompany || !editDeadlineDate) return;
    const time = editDeadlineTime || "23:59";
    setEntries(
      entries.map((e) =>
        e.id === editingId
          ? {
            ...e,
            company: editCompany,
            deadlineType: editDeadlineType,
            deadline: `${editDeadlineDate}T${time}`,
            status: editStatus,
            progress: STATUSES_WITH_PROGRESS.includes(editStatus)
              ? (editProgress || "審査中")
              : undefined,
          }
          : e
      )
    );
    setEditingId(null);
  };

  const sorted = [...entries].sort((a, b) => {
    // undefinedも含めて確実に0か1にする（!!で真偽値に変換してから数値化）
    const aSubmitted = a.submitted ? 1 : 0;
    const bSubmitted = b.submitted ? 1 : 0;
    if (aSubmitted !== bSubmitted) return aSubmitted - bSubmitted;

    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const getDeadlineTextClass = (entry: Entry) => {
    // ES提出が完了している場合は、緊急度に関わらず落ち着いた色（緑）にする
    if (entry.deadlineType === "エントリーシート締め切り" && entry.submitted) {
      return "text-green-600 font-semibold";
    }

    const now = new Date();
    const deadlineDateTime = new Date(entry.deadline);
    const diffDays =
      (deadlineDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) {
      // 締切を過ぎている場合は、赤ではなくグレー＋打ち消し線にして「期限切れ」を表現
      return "text-gray-400 line-through";
    } else if (diffDays <= 3) {
      return "text-red-600 font-semibold";
    } else if (diffDays <= 7) {
      return "text-yellow-600 font-semibold";
    } else {
      return "text-gray-500";
    }
  };

  const formatDeadline = (deadlineStr: string) => deadlineStr.replace("T", " ");

  const formatStatus = (entry: Entry) =>
    entry.progress ? `${entry.status} ${entry.progress}` : entry.status;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">就活エントリー管理</h1>

      <div className="flex flex-col gap-3 mb-8 p-4 border rounded-lg">
        <label className="flex flex-col gap-1 text-sm text-gray-600">
          企業名
          <input
            className="border rounded px-3 py-2 text-base text-black"
            placeholder="例：株式会社サンプル"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-600">
          締切の種類
          <select
            className="border rounded px-3 py-2 text-base text-black"
            value={deadlineType}
            onChange={(e) => setDeadlineType(e.target.value as DeadlineType)}
          >
            {DEADLINE_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-3">
          <label className="flex flex-col gap-1 text-sm text-gray-600 flex-1">
            締切日
            <input
              className="border rounded px-3 py-2 text-base text-black"
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-gray-600 flex-1">
            締切時刻（未入力なら23:59）
            <input
              className="border rounded px-3 py-2 text-base text-black"
              type="time"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm text-gray-600">
          選考状況
          <select
            className="border rounded px-3 py-2 text-base text-black"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        {STATUSES_WITH_PROGRESS.includes(status) && (
          <label className="flex flex-col gap-1 text-sm text-gray-600">
            進捗
            <select
              className="border rounded px-3 py-2 text-base text-black"
              value={progress}
              onChange={(e) => setProgress(e.target.value as Progress)}
            >
              {PROGRESS_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
          onClick={addEntry}
        >
          追加
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {sorted.map((entry) =>
          editingId === entry.id ? (
            <li
              key={entry.id}
              className="flex flex-col gap-3 border-2 border-blue-300 rounded-lg px-4 py-3 bg-blue-50"
            >
              <label className="flex flex-col gap-1 text-sm text-gray-600">
                企業名
                <input
                  className="border rounded px-3 py-2 text-base text-black"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-gray-600">
                締切の種類
                <select
                  className="border rounded px-3 py-2 text-base text-black"
                  value={editDeadlineType}
                  onChange={(e) =>
                    setEditDeadlineType(e.target.value as DeadlineType)
                  }
                >
                  {DEADLINE_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-3">
                <label className="flex flex-col gap-1 text-sm text-gray-600 flex-1">
                  締切日
                  <input
                    className="border rounded px-3 py-2 text-base text-black"
                    type="date"
                    value={editDeadlineDate}
                    onChange={(e) => setEditDeadlineDate(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-600 flex-1">
                  締切時刻
                  <input
                    className="border rounded px-3 py-2 text-base text-black"
                    type="time"
                    value={editDeadlineTime}
                    onChange={(e) => setEditDeadlineTime(e.target.value)}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-sm text-gray-600">
                選考状況
                <select
                  className="border rounded px-3 py-2 text-base text-black"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Status)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              {STATUSES_WITH_PROGRESS.includes(editStatus) && (
                <label className="flex flex-col gap-1 text-sm text-gray-600">
                  進捗
                  <select
                    className="border rounded px-3 py-2 text-base text-black"
                    value={editProgress}
                    onChange={(e) =>
                      setEditProgress(e.target.value as Progress)
                    }
                  >
                    {PROGRESS_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="flex gap-2">
                <button
                  className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
                  onClick={saveEdit}
                >
                  保存
                </button>
                <button
                  className="border rounded px-4 py-2 hover:bg-gray-100"
                  onClick={cancelEdit}
                >
                  キャンセル
                </button>
              </div>
            </li>
          ) : (
            <li
              key={entry.id}
              className="flex justify-between items-center border rounded-lg px-4 py-3"
            >
              <div>
                <p className="font-semibold flex items-center gap-2">
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() => startEdit(entry)}
                    title="クリックして編集"
                  >
                    {entry.company}
                  </span>
                  {entry.deadlineType === "エントリーシート締め切り" && (
                    <>
                      <span className="text-sm font-normal text-gray-500">
                        {entry.submitted ? "〇" : "未"}
                      </span>
                      {!entry.submitted && (
                        <button
                          className="text-xs font-normal bg-gray-600 text-white rounded px-2 py-1 hover:bg-green-700"
                          onClick={() => markSubmitted(entry.id)}
                        >
                          提出
                        </button>
                      )}
                    </>
                  )}
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">{entry.deadlineType}: </span>
                  <span className={getDeadlineTextClass(entry)}>
                    {formatDeadline(entry.deadline)}
                  </span>
                  <span className="text-gray-500">
                    |　選考状況: {formatStatus(entry)}
                  </span>
                </p>
              </div>
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => deleteEntry(entry.id)}
              >
                削除
              </button>
            </li>
          )
        )}
      </ul>

      {sorted.length === 0 && (
        <p className="text-gray-400 text-center mt-10">
          まだ登録がありません
        </p>
      )}
    </div>
  );
}