import { useEffect } from 'react'

function App() {
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/menu', {
          // include cookies if your API uses session auth; harmless otherwise
          credentials: 'include',
          headers: {
            'Accept': 'application/json, text/plain, */*'
          }
        });

        const contentType = res.headers.get('content-type') || '';
        if (!res.ok) {
          const errText = await res.text();
          console.error('GET /api/menu failed', { status: res.status, body: errText });
          return;
        }

        if (contentType.includes('application/json')) {
          const data = await res.json();
          console.log('GET /api/menu →', { status: res.status, ok: res.ok, data });
        } else {
          // Helpful when the server accidentally returns HTML (e.g., index.html)
          const text = await res.text();
          console.error('GET /api/menu expected JSON but received:', text.slice(0, 300));
        }
      } catch (err) {
        console.error('Network error calling /api/menu:', err);
      }
    })();
  }, []);

  return (
    <>
      <h1 className='bg-red-500'>Hello from Vite</h1>
      <p>Open the browser console to see the response from <code>/api/menu</code>.</p>
    </>
  );
}

export default App
