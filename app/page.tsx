"use client";

import { useState, useEffect } from "react";
//企業名・締切日・ステータスなど「変化するデータ」を管理する仕組み
type Status = "エントリー済み" | "書類選考中" | "一次面接" | "二次面接" | "最終面接" | "内定" | "不採用";

type Entry = {
  id: string;
  company: string;
  deadline: string;
  status: Status;
};

const STATUS_OPTIONS: Status[] = [
  "エントリー済み",
  "書類選考中",
  "一次面接",
  "二次面接",
  "最終面接",
  "内定",
  "不採用",
];

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [company, setCompany] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<Status>("エントリー済み");

  // 起動時にlocalStorageから読み込む
  // 起動時にlocalStorageから読み込む
  useEffect(() => {
    const saved = localStorage.getItem("entries");
    if (saved) {
      setEntries(JSON.parse(saved));
    }
    setIsLoaded(true); // ← 読み込み完了をマーク
  }, []);

  // 読み込みが終わってから、entriesが変わるたびにlocalStorageへ保存
  useEffect(() => {
    if (!isLoaded) return; // ← 読み込み前は何もしない
    localStorage.setItem("entries", JSON.stringify(entries));
  }, [entries, isLoaded]);
  //addEntry:入力内容から新しいエントリーを作ってリストに追加
  const addEntry = () => {
    if (!company || !deadline) return;
    const newEntry: Entry = {
      id: crypto.randomUUID(),
      company,
      deadline,
      status,
    };
    setEntries([...entries, newEntry]);
    setCompany("");
    setDeadline("");
    setStatus("エントリー済み");
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  //sorted:締切日が近い順に並べ替え
  const sorted = [...entries].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">就活エントリー管理</h1>

      <div className="flex flex-col gap-3 mb-8 p-4 border rounded-lg">
        <input
          className="border rounded px-3 py-2"
          placeholder="企業名"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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
              <p className="text-sm text-gray-500">
                締切: {entry.deadline}　|　{entry.status}
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