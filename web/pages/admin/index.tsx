import React, { useEffect, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

type Product = {
  id: number
  title: string
  description?: string
  priceCents: number
  slug: string
  assets?: { id: number; url: string }[]
}

export default function AdminIndex(){
  const { data: session } = useSession()
  const token = (session as any)?.accessToken
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)

  useEffect(()=>{
    fetchProducts()
  }, [session])

  async function fetchProducts(){
    setLoading(true)
    try{
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/products')
      const data = await res.json()
      setProducts(data)
      if (data && data.length && !selectedProductId) setSelectedProductId(data[0].id)
    }catch(e){ console.error(e) }
    setLoading(false)
  }

  async function doSignIn(e){
    e.preventDefault()
    await signIn('credentials', { redirect: false, email, password })
    fetchProducts()
  }

  async function createProduct(){
    const title = prompt('title')
    if (!title) return
    const slug = prompt('slug (e.g., my-product)')
    const price = Number(prompt('price in cents', '1999'))
    const description = prompt('description')
    const payload: any = { title, slug, priceCents: price, description }

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

  async function uploadFile(){
    if (!file) return alert('select a file')
    if (!selectedProductId) return alert('select a product')
    try{
      const presignRes = await fetch(process.env.NEXT_PUBLIC_API_URL + '/upload/presign', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ filename: file.name, contentType: file.type, productId: selectedProductId }) })
      const presign = await presignRes.json()
      if (!presign.presignedUrl) throw new Error('presign failed')

      // upload file to presigned URL
      const put = await fetch(presign.presignedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
      if (!put.ok) throw new Error('upload failed')

      // notify server to create ModelAsset
      const completeRes = await fetch(process.env.NEXT_PUBLIC_API_URL + '/upload/complete', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ productId: selectedProductId, url: presign.url, format: 'glb', main: true }) })
      const complete = await completeRes.json()
      if (complete.id) {
        alert('upload complete')
        setFile(null)
        fetchProducts()
      } else {
        alert('could not complete upload')
      }
    } catch (e:any){
      console.error(e)
      alert('upload error: ' + e.message)
    }
  }

  return (
    <div>
      <h1>Admin — Velura Gifts</h1>
      {!session ? (
        <form onSubmit={doSignIn} style={{maxWidth:420}}>
          <p>Log in as admin</p>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" style={{width:'100%', padding:8, marginBottom:8}} />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" style={{width:'100%', padding:8, marginBottom:8}} />
          <button type="submit">Login</button>
        </form>
      ) : (
        <div>
          <p>Authenticated as {session.user?.email}</p>
          <button onClick={()=>{signOut();}}>Logout</button>
          <hr />
          <button onClick={createProduct}>Create product</button>
          <div style={{marginTop:20}}>
            <h3>Products</h3>
            {loading ? <div>Loading...</div> : (
              <div style={{display:'grid', gap:12}}>
                <div>
                  <label>Select product to attach upload: </label>
                  <select value={selectedProductId ?? ''} onChange={e=>setSelectedProductId(Number(e.target.value))}>
                    {products.map(p=> <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div>
                  <input type="file" onChange={e=>setFile(e.target.files ? e.target.files[0] : null)} />
                  <button onClick={uploadFile} style={{marginLeft:8}}>Upload model</button>
                </div>
                {products.map(p=> (
                  <div key={p.id} style={{border:'1px solid #ddd', padding:12}}>
                    <strong>{p.title}</strong>
                    <div>${(p.priceCents/100).toFixed(2)}</div>
                    <div>{p.slug}</div>
                    <div>{p.description}</div>
                    <div>
                      Assets:
                      <ul>
                        {p.assets && p.assets.map(a => <li key={a.id}><a href={a.url} target="_blank" rel="noreferrer">{a.url}</a></li>)}
                      </ul>
                    </div>
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
