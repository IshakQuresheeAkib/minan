export const hideScrollbarClassName =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

export const richTextContentClassName =
  "[overflow-wrap:anywhere] [&_p]:min-h-[1.625em] [&_p+p]:mt-3 [&_ul]:my-3 [&_ul]:ps-[1.4rem] [&_ul]:list-disc [&_ol]:my-3 [&_ol]:ps-[1.4rem] [&_ol]:list-decimal [&_li+li]:mt-[0.3rem] [&_li>p]:min-h-0 [&_li>ul]:my-[0.35rem] [&_li>ul]:mb-0 [&_li>ol]:my-[0.35rem] [&_li>ol]:mb-0 [&_strong]:font-bold [&_em]:italic";

export const richTextEditorClassName =
  "min-h-40 p-3.5 text-sm leading-[1.625] outline-none selection:bg-primary/30 aria-disabled:cursor-not-allowed [&[contenteditable=false]]:cursor-not-allowed";
