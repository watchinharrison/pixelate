
const getBody = (req) => {
  let { body } = req;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (error) {
      return Promise.reject(error);
    }
  }
  return Promise.resolve(body);
};

module.exports = getBody;
