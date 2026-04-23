type Props = {
  label: string;
  value: string;
  sub?: string;
  subColor?: "gray" | "red" | "green";
};

const subColors = {
  gray: "text-gray-400",
  red: "text-red-500",
  green: "text-green-600",
};

export function MetricCard({ label, value, sub, subColor = "gray" }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      {sub && (
        <p className={`text-xs mt-1 ${subColors[subColor]}`}>{sub}</p>
      )}
    </div>
  );
}
