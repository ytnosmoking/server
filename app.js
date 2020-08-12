import express from 'express'

import db from './mongodb/db' // 数据库

import config from 'config-lite' // 配置  默认在根目录创建config default 使用

import router from './routes' // 所有 请求 路由

import cookieParser from 'cookie-parser' // cookie 解析

import session from 'express-session' // express 缓存

import connectMongo from 'connect-mongo' // 数据库连接

import winston from 'winston'
import expressWinston from 'express-winston' // 记录日志

import history from 'connect-history-api-fallback' //  为了单页请求时  让其他的 请求地址 指向默认 index.html

import chalk from 'chalk' //console 着色
import { conf } from 'qiniu'


const app = express()

// 跨域 允许源
app.all('*', (req, res, next) => {
	const { origin, Origin, referer, Referer } = req.headers
	const allowOrigin = origin || Origin || referer || Referer || '*' // 允许跨域
	res.header('Access-Control-Allow-Origin', allowOrigin)
	res.header('Access-Control-Allow-Headers', "Content-Type, Authorization, X-Requested-With")
	res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS')
	res.header('Access-Control-Allow-Credentials', true)
	res.header('X-Powered-By', 'Express')
	if (res.method === 'OPTIONS') {
		res.sendStatus(200)
	} else {
		next()
	}
})

//  使用 mongo 缓存
const MongoStore = connectMongo(session)
app.use(cookieParser())
app.use(session({
	name: config.session.name,
	secret: config.session.secret,
	resave: true,
	saveUninitialized: false,
	cookie: config.session.cookie,
	store: new MongoStore({
		url: config.url
	})
}))


// 成功日志记录
app.use(expressWinston.logger({
	transports: [
		new (winston.transports.Console)({
			json: true,
			colorize: true
		}),
		new winston.transports.File({
			filename: 'logs/success.log'
		})
	]
}))
// 所有 路由 请求
router(app)

// 失败日志
app.use(expressWinston.errorLogger({
	transports: [
		new winston.transports.Console({
			json: true,
			colorize: true
		}),
		new winston.transports.File({
			filename: 'logs/error.log'
		})
	]
}))


app.use(history())
app.use(express.static('./public'))
app.listen(config.port, () => {
	console.log(chalk.green(`成功监听   端口：${config.port}`))
})


