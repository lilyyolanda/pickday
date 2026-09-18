const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" }
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/todos")) return env.ASSETS.fetch(request);

    if (!env.DB) return json({ error: "D1 数据库尚未绑定" }, 500);
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[2] ? Number(parts[2]) : null;
    if (parts.length > 3 || (id !== null && !Number.isInteger(id))) return json({ error: "无效的任务 ID" }, 400);

    try {
      if (request.method === "GET" && id === null) {
        const { results } = await env.DB.prepare(
          "SELECT id, title, completed, created_at, updated_at FROM todos ORDER BY completed ASC, created_at DESC"
        ).all();
        return json(results.map(normalize));
      }
      if (request.method === "POST" && id === null) {
        const body = await request.json();
        const title = typeof body.title === "string" ? body.title.trim() : "";
        if (!title || title.length > 200) return json({ error: "待办内容不能为空且不能超过 200 个字符" }, 400);
        const result = await env.DB.prepare(
          "INSERT INTO todos (title) VALUES (?) RETURNING id, title, completed, created_at, updated_at"
        ).bind(title).first();
        return json(normalize(result), 201);
      }
      if (request.method === "PATCH" && id !== null) {
        const body = await request.json();
        if (typeof body.completed !== "boolean") return json({ error: "completed 必须是布尔值" }, 400);
        const result = await env.DB.prepare(
          "UPDATE todos SET completed = ?, updated_at = datetime('now') WHERE id = ? RETURNING id, title, completed, created_at, updated_at"
        ).bind(body.completed ? 1 : 0, id).first();
        return result ? json(normalize(result)) : json({ error: "任务不存在" }, 404);
      }
      if (request.method === "DELETE" && id !== null) {
        const result = await env.DB.prepare("DELETE FROM todos WHERE id = ?").bind(id).run();
        return result.meta.changes ? json({ ok: true }) : json({ error: "任务不存在" }, 404);
      }
      return json({ error: "不支持的请求方法" }, 405);
    } catch (error) {
      console.error(error);
      return json({ error: "数据库操作失败" }, 500);
    }
  }
};

function normalize(todo) {
  return { ...todo, completed: Boolean(todo.completed) };
}
