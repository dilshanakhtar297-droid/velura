import React from 'react'
import useSWR from 'swr'

const fetcher = (url) => fetch(url).then(r=>r.json())

export default function Home() {
  const { data } = useSWR(process.env.NEXT_PUBLIC_API_URL + '/products', fetcher)

  if (!data) return <div>Loading products...</div>

  return (
    <div>
      <h1>Velura Gifts</h1>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:16}}>
        {data.map(p => (
          <div key={p.id} style={{border:'1px solid #eee', padding:12}}>
            <h3>{p.title}</h3>
            <p>{p.description}</p>
            <p>${(p.priceCents/100).toFixed(2)}</p>
            <a href={`/product/${p.slug}`}>View</a>
          </div>
        ))}
      </div>
    </div>
  )
}
