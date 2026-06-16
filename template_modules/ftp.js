// Налаштування шаблону
import templateConfig from '../template.config.js'
// Логгер
import logger from './logger.js'

import FtpDeploy from "ftp-deploy";
const ftpDeploy = new FtpDeploy();

const isFtp = process.argv.includes('--ftp')
const isWp = process.argv.includes('--wp')

const config = {
	localRoot: isWp ? 'src/components/wordpress/fls-theme' : 'dist',
	host: templateConfig.ftp.host,
	port: templateConfig.ftp.port,
	include: ["*.*"],
	remoteRoot: templateConfig.ftp.remoteDir,
	user: templateConfig.ftp.user,
	password: templateConfig.ftp.password
}
export const ftpPlugin = [
	...((isFtp) ? [{
		name: "ftp-deploy",
		apply: 'build',
		enforce: 'post',
		closeBundle: {
			order: 'post',
			handler: () => {
				logger('_FTP_START')
				ftpDeploy
					.deploy(config)
					.then((res) => logger('_FTP_DONE'))
					.catch((err) => console.log(err))

			}
		}
	}] : [])
]