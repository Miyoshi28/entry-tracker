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

type DeadlineType = "エントリーシート締め切り" | "1次面接日" | "2次面接日" | "最終面接日";

type Entry = {
  id: string;
  company: string;
  deadlineType: DeadlineType;
  deadline: string; // "YYYY-MM-DDTHH:mm" 形式
  status: Status;
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
    };
    setEntries([...entries, newEntry]);
    setCompany("");
    setDeadlineType("エントリーシート締め切り");
    setDeadlineDate("");
    setDeadlineTime("23:59");
    setStatus("エントリー前");
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const sorted = [...entries].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  // 締切「日時」までの残り時間に応じて、文字色だけを返す
  const getDeadlineTextClass = (deadlineStr: string) => {
    const now = new Date();
    const deadlineDateTime = new Date(deadlineStr);
    const diffDays =
      (deadlineDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 3) {
      return "text-red-600 font-semibold";
    } else if (diffDays <= 7) {
      return "text-yellow-600 font-semibold";
    } else {
      return "text-gray-500";
    }
  };

  // "2026-10-01T23:59" → "2026-10-01 23:59" の見た目に整形
  const formatDeadline = (deadlineStr: string) => deadlineStr.replace("T", " ");

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

        <button
          className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
          onClick={addEntry}
        >
          追加
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {sorted.map((entry) => (
          <li
            key={entry.id}
            className="flex justify-between items-center border rounded-lg px-4 py-3"
          >
            <div>
              <p className="font-semibold">{entry.company}</p>
              <p className="text-sm">
                <span className="text-gray-500">
                  {entry.deadlineType}:{" "}
                </span>
                <span className={getDeadlineTextClass(entry.deadline)}>
                  {formatDeadline(entry.deadline)}
                </span>
                <span className="text-gray-500">
                  　|　選考状況: {entry.status}
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
        ))}
      </ul>

      {sorted.length === 0 && (
        <p className="text-gray-400 text-center mt-10">
          まだ登録がありません
        </p>
      )}
    </div>
  );
}