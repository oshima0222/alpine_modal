import { defineConfig } from 'vite';

import { resolve } from 'path';

//handlebarsプラグインimport
import handlebars from 'vite-plugin-handlebars';

// HTMLの複数出力を自動化する
//./src配下のファイル一式を取得
import fs from 'fs';

import path from 'path';

const files = [];
function readDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);

    if (fs.statSync(itemPath).isDirectory()) {
      // componentsディレクトリを除外する
      if (item === 'components') {
        continue;
      }

      readDirectory(itemPath);
    } else {
      // htmlファイル以外を除外する
      if (path.extname(itemPath) !== '.html') {
        continue;
      }

      // nameを決定する
      let name;
      if (dirPath === path.resolve(__dirname, 'src')) {
        name = path.parse(itemPath).name;
      } else {
        const relativePath = path.relative(path.resolve(__dirname, 'src'), dirPath);
        const dirName = relativePath.replace(/\//g, '_');
        name = `${dirName}_${path.parse(itemPath).name}`;
      }

      // pathを決定する
      const relativePath = path.relative(path.resolve(__dirname, 'src'), itemPath);
      const filePath = `/${relativePath}`;

      files.push({ name, path: filePath });
    }
  }
}
readDirectory(path.resolve(__dirname, 'src'));
const inputFiles = {};
for (let i = 0; i < files.length; i++) {
  const file = files[i];
  inputFiles[file.name] = resolve(__dirname, './src' + file.path );
}
/*
  この形を自動的に作る
  input:{
    index: resolve(__dirname, './src/index.html'),
    list: resolve(__dirname, './src/list.html')
  }
*/

//HTML上で出し分けたい各ページごとの情報
const pageData = {
  '/index.html': {
    isHome: true,
    title: 'Main Page',
  },
  '/list.html': {
    isHome: false,
    title: 'List Page',
  },
};

//CSSとJSファイルに更新パラメータを追加
const htmlPlugin = () => {
  return {
    name: 'html-transform',
    transformIndexHtml(html) {
      // npm run build のときのみ動作させる
      if(process.env.NODE_ENV !== 'production') {
        return;
      }

      //更新パラメータ作成
      const date = new Date();
      const param = date.getFullYear() + date.getMonth() + date.getDate() + date.getHours() + date.getMinutes() + date.getSeconds();

      // CSSファイルにパラメータを追加（httpsから始まる外部リンクは除外）
      let setParamHtml = html.replace(/(?=.*<link)(?=.*css)(?!.*https).*$/gm, match => {
        return match.replace(/\.css/, '.css?' + param);
      });

      // JSファイルにパラメータを追加して変更内容を返す（httpsから始まる外部リンクは除外）
      return setParamHtml.replace(/(?=.*<script)(?=.*js)(?!.*https).*$/gm, match => {
        return match.replace(/\.js/, '.js?' + param);
      });
    }
  }
}

export default defineConfig({
  server: {
    host: true //IPアドレスを有効化
  },
  base: './', //相対パスでビルドする
  root: './src', //開発ディレクトリ設定
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  build: {
    outDir: '../dist', //出力場所の指定
    rollupOptions: { //ファイル出力設定
      output: {
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.names[0].split('.')[1];
          //Webフォントファイルの振り分け
          if (/ttf|otf|eot|woff|woff2/i.test(extType)) {
            extType = 'fonts';
          }
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'images';
          }
          //ビルド時のCSS名を明記してコントロールする
          if(extType === 'css') {
            return `assets/css/style.css`;
          }
          return `assets/${extType}/[name][extname]`;
        },
        chunkFileNames: 'assets/js/[name].js',
        entryFileNames: 'assets/js/[name].js',
      },
      //生成オブジェクトを渡す
      input: inputFiles,
    },
  },
  /*
    プラグインの設定を追加
  */
  plugins: [
    handlebars({
      //コンポーネントの格納ディレクトリを指定
      partialDirectory: resolve(__dirname, './src/components'),
      //各ページ情報の読み込み
      context(pagePath) {
        return pageData[pagePath];
      },
    }),
    htmlPlugin()
  ],
});