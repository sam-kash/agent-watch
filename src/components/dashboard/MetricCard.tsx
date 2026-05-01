type Props = {
  label: string;
  value: string;
  sub?: string;
  subColor?: "red" | "gray";
};

export function MetricCard({ label, value, sub, subColor }: Props) {
  return (
    <div className="panel p-4">
      <p className="text-[9px] font-mono font-medium tracking-[0.12em] text-t-ghost uppercase mb-1">
        {label}
      </p>
      <p className="font-mono text-lg font-semibold text-t-primary">{value}</p>
      {sub && (
        <p className={`text-[10px] font-mono mt-0.5 ${subColor === "red" ? "text-acc-red" : "text-t-ghost"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}
