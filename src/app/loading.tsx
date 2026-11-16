import Image from 'next/image';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#123B5D]/25 backdrop-blur-xs">
      <div className="flex flex-col items-center justify-center rounded-3xl border border-white/80 bg-white/95 px-8 py-7 shadow-2xl shadow-[#123B5D]/20 backdrop-blur-md">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-[#18A999] border-r-[#123B5D] animate-spin" />
          <div className="relative h-9 w-9 animate-pulse">
            <Image
              src="/assets/icon.png"
              alt="Loading..."
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold text-[#123B5D] tracking-wide">
          लोड हुँदैछ... / Loading...
        </p>
      </div>
    </div>
  );
}
