export function joinClassNames(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export const interactiveButtonClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-xl text-sm font-semibold transition-[transform,box-shadow,background-color,border-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-100 hover:-translate-y-px hover:shadow-[0_16px_28px_-22px_rgba(15,23,42,0.45)] active:translate-y-0 active:shadow-[inset_0_1px_2px_rgba(15,23,42,0.14)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none";

export const primaryButtonClassName = `${interactiveButtonClassName} border border-amber-300 bg-[linear-gradient(135deg,rgba(250,224,166,1)_0%,rgba(232,199,138,1)_52%,rgba(199,155,91,1)_100%)] text-stone-950 shadow-[0_18px_28px_-24px_rgba(180,83,9,0.52)] hover:border-amber-200 hover:bg-[linear-gradient(135deg,rgba(252,230,181,1)_0%,rgba(239,208,152,1)_54%,rgba(206,164,99,1)_100%)] disabled:border-stone-300 disabled:bg-stone-300 disabled:text-stone-50`;

export const sidebarPrimaryButtonClassName = `${interactiveButtonClassName} border border-amber-300 bg-[linear-gradient(135deg,rgba(255,224,138,1)_0%,rgba(255,197,77,1)_100%)] text-slate-950 shadow-[0_18px_28px_-24px_rgba(217,119,6,0.75)] hover:border-amber-200 hover:bg-[linear-gradient(135deg,rgba(255,231,160,1)_0%,rgba(255,205,98,1)_100%)] focus-visible:ring-amber-100 disabled:border-stone-300 disabled:bg-stone-300`;

export const secondaryButtonClassName = `${interactiveButtonClassName} border border-stone-300 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(246,243,238,1)_100%)] text-slate-700 hover:border-amber-300 hover:bg-amber-50`;

export const dangerButtonClassName = `${interactiveButtonClassName} border border-rose-200 bg-rose-50 text-rose-900 hover:border-rose-300 hover:bg-rose-100`;

export const fieldBoxSizeClassName = "h-11 min-h-11 px-3.5 py-2.5";

export const formControlClassName =
  `${fieldBoxSizeClassName} w-full rounded-[1.15rem] border border-stone-300 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(248,246,242,0.98)_100%)] text-sm text-slate-900 outline-none shadow-[0_14px_30px_-26px_rgba(15,23,42,0.38),0_1px_2px_rgba(15,23,42,0.05)] transition-[border-color,box-shadow,background-color,transform] duration-150 ease-out hover:border-amber-300 hover:bg-white focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100`;

export const selectControlClassName =
  `${fieldBoxSizeClassName} cursor-pointer text-[0.95rem] font-medium tracking-[-0.01em]`;

export const compactSelectControlClassName = `${selectControlClassName} rounded-full text-sm text-slate-700`;

export const dateControlClassName =
  `${fieldBoxSizeClassName} cursor-pointer text-[0.95rem] font-medium tracking-[0.02em]`;
