const block = "animate-pulse rounded-card bg-surface";

export function HomeSkeleton() {
  return (
    <main id="contenido" aria-busy="true" aria-label="Cargando proyectos" className="mx-auto flex w-full max-w-[1376px] flex-col gap-[22px] px-4 sm:px-8 py-7">
      <div className="flex flex-col gap-2">
        <div className={`${block} h-4 w-40`} />
        <div className={`${block} h-9 w-72`} />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-[76px]`} />
        ))}
      </div>
      <div className={`${block} h-9 w-[520px] max-w-full`} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 min-[1280px]:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`${block} h-[250px]`} />
        ))}
      </div>
    </main>
  );
}
