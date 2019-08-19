let willbeServer = 'http://47.107.35.8:8281/spider-oper';
// console.log(process.env.NODE_ENV,willbeServer)
if (process.env.NODE_ENV == "development") {
  willbeServer = 'http://ha-web.ittun.com/web/spider'
} else if (process.env.NODE_ENV == 'local') {
  willbeServer = 'http://spider.ittun.com/spider-oper'
}
let config = {
  token: 'KE923jddu#@(DFDJiw1dI$*FYHHHHH',
  willbeServer: willbeServer
}
export default config;