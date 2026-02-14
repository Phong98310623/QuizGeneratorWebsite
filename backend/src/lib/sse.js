/**
 * In-memory SSE: đăng ký các kết nối admin và broadcast khi có thông báo mới.
 */
const clients = new Set();

function register(res) {
  clients.add(res);
  res.on('close', () => {
    clients.delete(res);
  });
}

function unregister(res) {
  clients.delete(res);
}

/**
 * Gửi event tới tất cả client đang kết nối.
 * @param {object} payload - Object sẽ được gửi dạng JSON (event data).
 */
function broadcast(payload) {
  const data = JSON.stringify(payload);
  clients.forEach((res) => {
    try {
      res.write(`data: ${data}\n\n`);
    } catch (err) {
      clients.delete(res);
    }
  });
}

module.exports = { register, unregister, broadcast };
