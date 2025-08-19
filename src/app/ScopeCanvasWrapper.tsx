"use client";
import dynamic from "next/dynamic";

const ScopeCanvas = dynamic(() => import("./ScopeCanvas"), { ssr: false });

export default function ScopeCanvasWrapper() {
  return <ScopeCanvas />;
}
