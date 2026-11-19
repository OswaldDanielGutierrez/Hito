const block = "animate-pulse rounded-card bg-surface";

export function ProjectBodySkeleton() {
  return (
    <main aria-busy="true" aria-label="Cargando proyecto" className="mx-auto flex w-full max-w-[1376px] flex-col gap-[22px] px-8 py-6">
      <div className={`${block} h-6 w-64`} />
      <div className="grid grid-cols-6 gap-3.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`${block} h-[150px]`} />
        ))}
      </div>
      <div className="grid grid-cols-[1fr_380px] gap-[22px]">
        <div className={`${block} h-[280px]`} />
        <div className={`${block} h-[280px]`} />
      </div>
    </main>
  );
}
