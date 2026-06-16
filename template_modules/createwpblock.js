// Налаштування шаблону
import templateConfig from '../template.config.js'
// Логгер
import logger from './logger.js'
import fs from 'fs'
import path from 'path'

const htmlPath = `src/components/custom`
const phpPath = `src/components/wordpress/fls-theme/components/blocks`

async function createFlsComponent() {
	const name = process.argv[2].toLowerCase()
	if (!name || /[а-яА-ЯёЁіїєґІЇЄҐ0-9\s\p{P}]/gu.test(name)) {
		logger(`_CREATE_COMPONENT_ERROR`)
	} else {
		const folderPath = findFolderRecursive(`${phpPath}`, name)
		if (fs.existsSync(`${phpPath}/${name}`) || folderPath) {
			logger(`_CREATE_COMPONENT_EXIST`, [name, folderPath])
		} else {
			fs.mkdirSync(`${phpPath}/${name}`)
			fs.mkdirSync(`${phpPath}/${name}/assets`)
			fs.writeFileSync(`${phpPath}/${name}/assets/${name}.scss`, ``)
			fs.writeFileSync(`${phpPath}/${name}/assets/${name}.js`, `// Підключення функціоналу "Чортоги Фрілансера"\nimport { addTouchAttr, addLoadedAttr, isMobile, FLS } from "@js/common/functions.js"\n\nimport "./${name}.scss"`)
			fs.writeFileSync(`${phpPath}/${name}/${name}.php`, `
<?php $fields = get_fls_fields($page_id);?>
<!-- <pre> <?php // var_dump($fields); ?></pre> -->

<section class="${name}">
	<div class="${name}__container">
		
	</div>
</section>`)
			fs.writeFileSync(`${phpPath}/${name}/block.json`, `
{
  "name": "${name}",
  "title": "${name}",
  "category": "formatting",
  "icon": "<svg xmlns='http://www.w3.org/2000/svg' id='Layer_1' data-name='Layer 1' viewBox='0 0 24 24' width='512' height='512'><path d='M21.5,3H12.118L8.118,1H2.5C1.122,1,0,2.121,0,3.5V23H8.346l-1-1H1V8H23v14h-6.365l-1,1h8.365V5.5c0-1.379-1.121-2.5-2.5-2.5ZM1,7V3.5c0-.827,.673-1.5,1.5-1.5H7.882l4,2h9.618c.827,0,1.5,.673,1.5,1.5v1.5H1Zm15.596,12.22l-3.202,3.203c-.384,.384-.889,.576-1.394,.576s-1.009-.192-1.394-.576l-3.203-3.203,.707-.707,3.203,3.203c.057,.057,.12,.106,.187,.146V12h1v9.862c.066-.04,.129-.088,.187-.146l3.202-3.203,.707,.707Z'/></svg>",
  "editorStyle": "file:../admin/dist/css/${name}.css",
  "editorScript": "file:../admin/dist/${name}.js",
  "acf": {
    "mode": "preview",
    "renderTemplate": "${name}.php"
  },
  "supports": {
    "align": true
  }
}	
			`)
			logger(`_CREATE_COMPONENT_DONE`, name)
		}
	}
}
function findFolderRecursive(startPath, folderName) {
	if (!fs.existsSync(startPath)) {
		return false;
	}
	const files = fs.readdirSync(startPath);
	for (const file of files) {
		const fullPath = path.join(startPath, file);
		const stat = fs.statSync(fullPath);
		if (stat.isDirectory()) {
			if (file === folderName) {
				return fullPath; // Знайшли потрібну папку
			}
			const found = findFolderRecursive(fullPath, folderName);
			if (found) return found;
		}
	}
	return false;
}
createFlsComponent()
