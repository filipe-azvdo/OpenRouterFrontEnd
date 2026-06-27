"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert, Spinner } from "@/components/ui/Feedback";
import { ApiError, getImport, importTolls } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { TollPlazaImportResultDto } from "@/lib/types";

const TERMINAL = new Set(["SUCCESS", "FAILED"]);

function StatusBadge({ status }: { status: string }) {
  if (status === "SUCCESS") return <Badge tone="dark">Concluído</Badge>;
  if (status === "FAILED") return <Badge tone="orange">Falhou</Badge>;
  return <Badge tone="cream">Processando…</Badge>;
}

function Counter({ value, label }: { value: number | null | undefined; label: string }) {
  return (
    <div className="rounded-md border border-hairline-soft bg-surface px-4 py-3 text-center">
      <div className="font-editorial text-3xl text-ink">{value ?? "—"}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-steel">
        {label}
      </div>
    </div>
  );
}

export function TollImport() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TollPlazaImportResultDto | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpa o polling ao desmontar.
  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  function schedulePoll(id: string, attempt: number) {
    if (attempt > 30) return; // ~1 min de polling
    pollRef.current = setTimeout(async () => {
      try {
        const next = await getImport(id);
        setResult(next);
        if (!TERMINAL.has(next.status)) schedulePoll(id, attempt + 1);
      } catch {
        // mantém o último resultado; para de tentar
      }
    }, 2000);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);
    if (pollRef.current) clearTimeout(pollRef.current);
    try {
      const res = await importTolls(file);
      setResult(res);
      if (!TERMINAL.has(res.status)) schedulePoll(res.importId, 1);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Falha ao enviar o CSV.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <Card tone="cream" className="h-fit">
        <h2 className="text-lg font-semibold text-ink">Importar praças de pedágio</h2>
        <p className="mt-2 text-sm text-slate">
          Envie um CSV (UTF-8, delimitado por <code className="font-mono">;</code>, 13 colunas).
          O processamento é assíncrono e idempotente.
        </p>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-beige-deep bg-canvas px-4 py-8 text-center transition-colors hover:border-primary">
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <span className="text-sm font-medium text-ink">
            {file ? file.name : "Clique para escolher um arquivo .csv"}
          </span>
          {file && (
            <span className="text-[13px] text-steel">{(file.size / 1024).toFixed(1)} KB</span>
          )}
        </label>

        {error && (
          <div className="mt-3">
            <Alert tone="error">{error}</Alert>
          </div>
        )}

        <Button
          className="mt-4 w-full"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? <Spinner /> : null}
          Enviar CSV
        </Button>
      </Card>

      <div>
        {result ? (
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-ink">Resultado do import</h3>
              <StatusBadge status={result.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Counter value={result.totalRows} label="Linhas" />
              <Counter value={result.inserted} label="Inseridas" />
              <Counter value={result.updated} label="Atualizadas" />
              <Counter value={result.reactivated} label="Reativadas" />
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-1 text-[13px] text-steel sm:grid-cols-2">
              <div>
                <dt className="inline font-medium text-slate">Import:</dt>{" "}
                <dd className="inline font-mono">{result.importId}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-slate">Criado:</dt>{" "}
                <dd className="inline">{formatDateTime(result.createdAt)}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-slate">Finalizado:</dt>{" "}
                <dd className="inline">{formatDateTime(result.finishedAt)}</dd>
              </div>
              <div className="truncate">
                <dt className="inline font-medium text-slate">Hash:</dt>{" "}
                <dd className="inline font-mono">{result.contentHash?.slice(0, 16)}…</dd>
              </div>
            </dl>

            {!TERMINAL.has(result.status) && (
              <p className="mt-4 flex items-center gap-2 text-sm text-steel">
                <Spinner /> Acompanhando o processamento…
              </p>
            )}

            {result.errors.length > 0 && (
              <div className="mt-5">
                <h4 className="mb-2 text-sm font-semibold text-primary-deep">
                  Erros por linha ({result.errors.length})
                </h4>
                <ul className="max-h-60 overflow-auto rounded-md border border-hairline-soft bg-surface text-[13px]">
                  {result.errors.map((err, i) => (
                    <li
                      key={i}
                      className="flex gap-3 border-b border-hairline-soft px-3 py-2 last:border-0"
                    >
                      <span className="font-mono text-steel">L{err.line}</span>
                      <span className="text-ink">{err.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ) : (
          <Card className="flex min-h-[280px] flex-col items-center justify-center text-center">
            <p className="font-editorial text-2xl text-ink">Aguardando um arquivo</p>
            <p className="mt-2 max-w-sm text-sm text-steel">
              O resultado do import — contagens, status e erros por linha — aparece aqui.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
