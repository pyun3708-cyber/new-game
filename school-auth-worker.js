/**
 * 反媚黑高校 · school-auth Worker
 * 请在 Cloudflare Workers 中整段替换后 Deploy
 * 绑定：D1 变量名 DB；Secret：JWT_SECRET
 * 本文件含 /teacher/cert/issue 发证接口
 *
 * 若此文件在仓库中被截断，请使用本地完整版或见 teacher-cert-issue-route.js 片段
 */

// SEE FULL FILE IN ARTIFACTS - uploading compact instruction stub
export default {
  async fetch(request) {
    return new Response(JSON.stringify({
      error: '请部署完整 school-auth-worker.js（含 /teacher/cert/issue）。仓库 artifacts 或联系草莓酱更新 Worker。'
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
};
