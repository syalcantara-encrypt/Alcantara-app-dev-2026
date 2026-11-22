import { useState, useEffect } from 'react';
import * as api from './api';

// ---------- list of posts (also used for "My Posts") ----------
function PostList({ go, mine }) {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = mine ? api.getMyPosts : api.getPosts;
    load()
      .then(setPosts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [mine]);

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between border-b border-white/50 pb-3">
        <h2 className="text-2xl font-bold text-[#24382c] tracking-tight">
          {mine ? 'My Tea House Notes' : 'All Blogs'}
        </h2>
        <span className="text-xs uppercase tracking-widest text-[#4e4336] bg-white/55 backdrop-blur-md border border-white/60 px-3.5 py-1 rounded-full shadow-xs">
          {posts.length} {posts.length === 1 ? 'story' : 'stories'}
        </span>
      </div>

      {loading && <p className="text-[#5c5042] italic">Brewing stories...</p>}
      {error && (
        <p className="bg-red-500/15 backdrop-blur-md border border-red-400/40 text-red-900 px-4 py-3 rounded-2xl text-sm">
          {error}
        </p>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="bg-white/45 backdrop-blur-xl border border-white/65 rounded-3xl p-10 text-center shadow-[0_8px_32px_rgba(44,37,29,0.08)]">
          <p className="text-[#4a3f33] text-lg font-medium">No posts yet.</p>
          <p className="text-sm text-[#786957] mt-1">Sit down for tea and write the very first entry.</p>
        </div>
      )}

      <div className="grid gap-4">
        {posts.map((p) => (
          <article
            key={p.id}
            onClick={() => go('detail', p.id)}
            className="group cursor-pointer bg-white/50 hover:bg-white/70 backdrop-blur-xl border border-white/70 hover:border-[#4a6b57]/50 rounded-3xl p-6 shadow-[0_8px_30px_rgba(44,37,29,0.07)] hover:shadow-[0_12px_36px_rgba(44,37,29,0.12)] transition-all"
          >
            <h3 className="text-xl font-bold text-[#241e18] group-hover:text-[#355943] transition-colors">
              {p.title}
            </h3>
            <p className="text-[#4f4437] mt-2 leading-relaxed">
              {p.content.length > 140 ? p.content.slice(0, 140) + '...' : p.content}
            </p>
            <div className="mt-4 pt-3 border-t border-white/50 flex items-center justify-between text-xs text-[#6e604f]">
              <span className="font-semibold text-[#3c5e49]">@{p.author_username}</span>
              <span>{new Date(p.created_at).toLocaleString()}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ---------- one post, with Edit / Delete buttons depending on role ----------
function PostDetail({ id, user, go }) {
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPost(id).then(setPost).catch((e) => setError(e.message));
  }, [id]);

  const canEdit = user && post && (user.id === post.author_id || user.role === 'admin');
  const canDelete = user && user.role === 'admin';

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.deletePost(id);
      go('list');
    } catch (e) {
      setError(e.message);
    }
  };

  if (error) {
    return (
      <p className="bg-red-500/15 backdrop-blur-md border border-red-400/40 text-red-900 px-4 py-3 rounded-2xl">
        {error}
      </p>
    );
  }
  if (!post) return <p className="text-[#5c5042] italic">Loading...</p>;

  return (
    <section className="bg-white/55 backdrop-blur-xl border border-white/70 rounded-3xl p-8 shadow-[0_8px_32px_rgba(44,37,29,0.08)]">
      <div className="border-b border-white/55 pb-4 mb-6">
        <h2 className="text-3xl font-bold text-[#241e18]">{post.title}</h2>
        <p className="text-sm text-[#6e604f] mt-2">
          by <span className="font-semibold text-[#3c5e49]">{post.author_username}</span> ·{' '}
          {new Date(post.created_at).toLocaleString()}
        </p>
      </div>

      <p className="whitespace-pre-wrap text-[#332b22] leading-relaxed text-lg mb-8">
        {post.content}
      </p>

      <div className="flex flex-wrap gap-3 pt-4 border-t border-white/55">
        {canEdit && (
          <button
            onClick={() => go('edit', post.id)}
            className="px-4 py-2 rounded-xl bg-[#4a6b57]/90 hover:bg-[#3a5645] backdrop-blur-md text-white text-sm font-medium shadow-xs transition cursor-pointer"
          >
            Edit
          </button>
        )}
        {canDelete && (
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-xl bg-[#b84a39]/90 hover:bg-[#9c3b2c] backdrop-blur-md text-white text-sm font-medium shadow-xs transition cursor-pointer"
          >
            Delete
          </button>
        )}
        <button
          onClick={() => go('list')}
          className="px-4 py-2 rounded-xl border border-white/70 bg-white/55 hover:bg-white/80 backdrop-blur-md text-[#3d342a] text-sm font-medium transition cursor-pointer"
        >
          Back
        </button>
      </div>
    </section>
  );
}

// ---------- login and register form ----------
function AuthForm({ mode, onLoggedIn, onRegistered }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('reader');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        onLoggedIn(await api.login(username, password));
      } else {
        await api.register({ username, email, password, role });
        onRegistered();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="max-w-md mx-auto bg-white/55 backdrop-blur-xl border border-white/75 rounded-3xl p-8 shadow-[0_8px_32px_rgba(44,37,29,0.09)]">
      <h2 className="text-2xl font-bold text-[#24382c] mb-6">
        {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
      </h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#4a3f33] mb-1">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-3.5 py-2 rounded-xl border border-white/75 bg-white/60 backdrop-blur-md focus:bg-white/85 focus:outline-none focus:border-[#4a6b57] transition"
          />
        </div>
        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-[#4a3f33] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-white/75 bg-white/60 backdrop-blur-md focus:bg-white/85 focus:outline-none focus:border-[#4a6b57] transition"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-[#4a3f33] mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2 rounded-xl border border-white/75 bg-white/60 backdrop-blur-md focus:bg-white/85 focus:outline-none focus:border-[#4a6b57] transition"
          />
        </div>
        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-[#4a3f33] mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-white/75 bg-white/60 backdrop-blur-md focus:bg-white/85 focus:outline-none focus:border-[#4a6b57] transition"
            >
              <option value="reader">reader</option>
              <option value="author">author</option>
              <option value="admin">admin</option>
            </select>
          </div>
        )}
        {error && (
          <p className="text-sm text-red-900 bg-red-500/15 backdrop-blur-md border border-red-400/40 px-3 py-2 rounded-xl">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-[#4a6b57]/90 hover:bg-[#3a5645] backdrop-blur-md text-white font-semibold shadow-sm transition cursor-pointer"
        >
          {mode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>
    </section>
  );
}

// ---------- create a new post, or edit an existing one ----------
function PostForm({ id, go }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      api
        .getPost(id)
        .then((p) => {
          setTitle(p.title);
          setContent(p.content);
        })
        .catch((e) => setError(e.message));
    }
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (id) {
        await api.updatePost(id, { title, content });
        go('detail', id);
      } else {
        const created = await api.createPost({ title, content });
        go('detail', created.id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="bg-white/55 backdrop-blur-xl border border-white/75 rounded-3xl p-8 shadow-[0_8px_32px_rgba(44,37,29,0.09)]">
      <h2 className="text-2xl font-bold text-[#24382c] mb-6">
        {id ? 'Edit Post' : 'New Blog'}
      </h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#4a3f33] mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3.5 py-2 rounded-xl border border-white/75 bg-white/60 backdrop-blur-md focus:bg-white/85 focus:outline-none focus:border-[#4a6b57] transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#4a3f33] mb-1">Content</label>
          <textarea
            rows="8"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className="w-full px-3.5 py-2 rounded-xl border border-white/75 bg-white/60 backdrop-blur-md focus:bg-white/85 focus:outline-none focus:border-[#4a6b57] transition"
          />
        </div>
        {error && (
          <p className="text-sm text-red-900 bg-red-500/15 backdrop-blur-md border border-red-400/40 px-3 py-2 rounded-xl">
            {error}
          </p>
        )}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-[#4a6b57]/90 hover:bg-[#3a5645] backdrop-blur-md text-white font-semibold shadow-sm transition cursor-pointer"
          >
            {id ? 'Save changes' : 'Publish'}
          </button>
          <button
            type="button"
            onClick={() => go('list')}
            className="px-5 py-2 rounded-xl border border-white/75 bg-white/55 hover:bg-white/80 backdrop-blur-md text-[#3d342a] font-medium transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

// ---------- the whole app ----------
export default function App() {
  const [user, setUser] = useState(api.getSession());
  const [view, setView] = useState({ name: 'list', id: null });
  const [notice, setNotice] = useState('');

  const go = (name, id = null) => {
    setNotice('');
    setView({ name, id });
  };

  useEffect(() => {
    api.setOnSessionExpired(() => {
      setUser(null);
      setView({ name: 'login', id: null });
      setNotice('Session expired. Please log in again.');
    });
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    go('list');
  };

  const isWriter = user && (user.role === 'author' || user.role === 'admin');

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-4xl w-full mx-auto px-5 py-8 flex-1">
        {/* Ghibli Glassmorphism Hero + Header */}
        <header className="mb-8 rounded-3xl overflow-hidden border border-white/70 bg-white/45 backdrop-blur-xl shadow-[0_12px_40px_rgba(44,37,29,0.1)]">
          <div className="grid sm:grid-cols-2 bg-[#2b241d]/90 backdrop-blur-md">
            <div className="p-8 sm:p-10 flex flex-col justify-center">
              <span className="text-xs uppercase tracking-[0.2em] text-[#e6d5b8] mb-2">
                Spirited Stories &amp; Tea
              </span>
              <h1
                onClick={() => go('list')}
                className="text-3xl sm:text-4xl font-bold text-[#faf6ee] tracking-wide cursor-pointer hover:text-[#e6d5b8] transition"
              >
                BLOG PLATFORM
              </h1>
              <p className="text-sm text-[#d6c9b4] mt-3 leading-relaxed">
                A cozy corner for quiet thoughts, stories, and warm tea.
              </p>
            </div>
            <img
              src="/Studio%20Ghibli%20GIFs.jpg.gif"
              alt="Ghibli Tea House"
              className="w-full h-full object-cover"
            />
          </div>

          <nav className="flex flex-wrap items-center gap-2 px-6 py-3.5 bg-white/50 backdrop-blur-xl border-t border-white/60">
            <button
              onClick={() => go('list')}
              className="px-3.5 py-1.5 rounded-xl text-sm font-medium bg-white/65 hover:bg-[#4a6b57] hover:text-white border border-white/80 text-[#332b22] shadow-2xs transition cursor-pointer"
            >
              Blogs
            </button>
            {user && (
              <button
                onClick={() => go('mine')}
                className="px-3.5 py-1.5 rounded-xl text-sm font-medium bg-white/65 hover:bg-[#4a6b57] hover:text-white border border-white/80 text-[#332b22] shadow-2xs transition cursor-pointer"
              >
                My Posts
              </button>
            )}
            {isWriter && (
              <button
                onClick={() => go('new')}
                className="px-3.5 py-1.5 rounded-xl text-sm font-medium bg-[#4a6b57]/90 hover:bg-[#3a5645] text-white shadow-2xs transition cursor-pointer"
              >
                + New Blog
              </button>
            )}
            {!user && (
              <>
                <button
                  onClick={() => go('login')}
                  className="px-3.5 py-1.5 rounded-xl text-sm font-medium bg-white/65 hover:bg-[#4a6b57] hover:text-white border border-white/80 text-[#332b22] shadow-2xs transition cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => go('register')}
                  className="px-3.5 py-1.5 rounded-xl text-sm font-medium bg-[#4a6b57]/90 hover:bg-[#3a5645] text-white shadow-2xs transition cursor-pointer"
                >
                  Register
                </button>
              </>
            )}
            {user && (
              <div className="ml-auto flex items-center gap-3">
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/65 border border-white/80 text-[#3d342a]">
                  {user.username} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 rounded-xl text-sm font-medium bg-white/65 hover:bg-[#b84a39] hover:text-white border border-white/80 text-[#332b22] shadow-2xs transition cursor-pointer"
                >
                  Logout
                </button>
              </div>
            )}
          </nav>
        </header>

        {notice && (
          <p className="mb-6 rounded-2xl bg-[#4a6b57]/15 backdrop-blur-md border border-[#4a6b57]/35 text-[#264231] px-4 py-3 text-sm">
            {notice}
          </p>
        )}

        <main>
          {view.name === 'list' && <PostList key="list" go={go} />}
          {view.name === 'mine' && user && <PostList key="mine" go={go} mine />}
          {view.name === 'detail' && <PostDetail key={'d' + view.id} id={view.id} user={user} go={go} />}
          {view.name === 'login' && (
            <AuthForm
              key="login"
              mode="login"
              onLoggedIn={(u) => {
                setUser(u);
                go('list');
              }}
            />
          )}
          {view.name === 'register' && (
            <AuthForm
              key="register"
              mode="register"
              onRegistered={() => {
                setView({ name: 'login', id: null });
                setNotice('Registered! You can now log in.');
              }}
            />
          )}
          {view.name === 'new' && isWriter && <PostForm key="new" go={go} />}
          {view.name === 'edit' && user && <PostForm key={'e' + view.id} id={view.id} go={go} />}
        </main>
      </div>

      <footer className="py-5 text-center text-xs text-[#6e604f] border-t border-white/50 bg-white/35 backdrop-blur-md">
        Copyright © Blog Platform 2026
      </footer>
    </div>
  );
}