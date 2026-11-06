import Link from "next/link";
import { leadSlugs } from "@/leads";

export default function Home() {
  const dev = process.env.NODE_ENV === "development";
  return (
    <main className="home">
      <div>
        <h1>camu · unboxing</h1>
        <p>Cada lead tem o seu endereço: /p/&lt;slug&gt;</p>
        {dev && (
          <ul>
            {leadSlugs().map((s) => (
              <li key={s}><Link href={`/p/${s}`}>/p/{s}</Link></li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
