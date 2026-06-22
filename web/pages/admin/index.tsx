import React, { useEffect, useState } from 'react'

type Product = {
  id: number
  title: string
  description?: string
  priceCents: number
  slug: string
  assets?: { id: number; url: string }[]
}

export default function AdminIndex(){
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    const t = localStorage.getItem('velura_token')
    if (t) setToken(t)
    fetchProducts()
  }, [])

  async function fetchProducts(){
    setLoading(true)
    try{
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/products')
      const data = await res.json()
      setProducts(data)
    }catch(e){ console.error(e) }
    setLoading(false)
  }

  async function login(e){
    e.preventDefault()
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    const data = await res.json()
    if (data.token){
      setToken(data.token)
      localStorage.setItem('velura_token', data.token)
      fetchProducts()
    } else {
      alert('login failed')
    }
  }

  async function createProduct(){
    const title = prompt('title')
    if (!title) return
    const slug = prompt('slug (e.g., my-product)')
    const price = Number(prompt('price in cents', '1999'))
    const description = prompt('description')
    const assetUrl = prompt('asset URL (optional)')

    const payload: any = { title, slug, priceCents: price, description }
    if (assetUrl) payload.assets = [{ url: assetUrl, format: 'glb', main: true }]

    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/products', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(payload) })
    if (res.ok) {
      alert('created')
      fetchProducts()
    } else {
      const err = await res.json()
      alert('error: ' + (err?.error || 'unknown'))
    }
  }

  async function delProduct(id:number){
    if (!confirm('Delete product?')) return
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/products/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
    if (res.ok) fetchProducts()
  }

  return (
    <div>
      <h1>Admin — Velura Gifts</h1>
      {!token ? (
        <form onSubmit={login} style={{maxWidth:420}}>
          <p>Log in as admin</p>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" style={{width:'100%', padding:8, marginBottom:8}} />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" style={{width:'100%', padding:8, marginBottom:8}} />
          <button type="submit">Login</button>
        </form>
      ) : (
        <div>
          <p>Authenticated</p>
          <button onClick={()=>{ localStorage.removeItem('velura_token'); setToken(null) }}>Logout</button>
          <hr />
          <button onClick={createProduct}>Create product</button>
          <div style={{marginTop:20}}>
            <h3>Products</h3>
            {loading ? <div>Loading...</div> : (
              <div style={{display:'grid', gap:12}}>
                {products.map(p=> (
                  <div key={p.id} style={{border:'1px solid #ddd', padding:12}}>
                    <strong>{p.title}</strong>
                    <div>${(p.priceCents/100).toFixed(2)}</div>
                    <div>{p.slug}</div>
                    <div>{p.description}</div>
                    <div style={{marginTop:8}}>
                      <button onClick={()=>delProduct(p.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
