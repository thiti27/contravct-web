export default function PageContainer({ children, className = '' }) {
  return <div className={`mx-auto w-full max-w-[1500px] px-6 py-7 ${className}`}>{children}</div>;
}
