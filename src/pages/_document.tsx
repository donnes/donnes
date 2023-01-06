import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en" className="dark h-full antialiased ">
      <Head />
      <body className="flex h-full flex-col bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
