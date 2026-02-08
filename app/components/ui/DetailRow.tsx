export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-all text-right">{value}</dd>
    </div>
  );
}
