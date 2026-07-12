const URL_PATTERN = /(https?:\/\/[^\s<>"']+)/g;

export function LinkifyText({ children }: { children: string }) {
  const parts = children.split(URL_PATTERN);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={`${i}-${part}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}
