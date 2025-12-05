// ==UserScript==
// @name         農地マップ自動化
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  遊休農地情報を自動取得しコピー
// @author       You
// @match        https://map.maff.go.jp/*
// @grant        GM_setClipboard
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';

    // 自動実行のタイミング
    window.addEventListener('load', function() {
        setTimeout(automate, 2000); // ページ読み込み後2秒待機
    });

    function automate() {
        // ラジオボタン選択（3種類すべて）
        const labels = document.querySelectorAll('label');
        let found = false;

        labels.forEach(label => {
            const text = label.textContent.trim();
            
            // 3種類のラジオボタンをすべて選択
            if (text.includes('遊休農地（不耕作緑）') || 
                text.includes('遊休農地（不耕作黄）') || 
                text.includes('遊休農地（低利用）')) {
                
                const radio = label.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                    found = true;
                }
            }
        });

        if (found) {
            console.log('ラジオボタンを選択しました');
            
            // フォーム送信
            setTimeout(submitForm, 500);
        }
    }

    function submitForm() {
        // 「検索」ボタンを探して押す
        const buttons = document.querySelectorAll('button');
        let submitted = false;

        buttons.forEach(btn => {
            if (btn.textContent.includes('検索') || btn.textContent.includes('検索する')) {
                btn.click();
                submitted = true;
                console.log('検索ボタンをクリックしました');
            }
        });

        if (submitted) {
            // 結果表示を待機してコピー
            setTimeout(extractAndCopy, 3000);
        }
    }

    function extractAndCopy() {
        // ページ全体のテキストから件数を抽出
        const pageText = document.body.innerText;
        
        // 「現在 X,XXX 件」 という形式を探す
        const match = pageText.match(/現在[\s　]*([0-9,]+)\s*件/);
        
        if (match && match[1]) {
            const count = match[1].replace(/,/g, ''); // カンマを削除して数字のみ抽出
            
            GM_setClipboard(count);
            console.log('クリップボードにコピーしました: ' + count);
            
            // 通知表示
            GM_notification({
                title: '農地マップ自動化',
                text: '件数をコピーしました: ' + count,
                timeout: 3000
            });
        } else {
            console.log('件数が見つかりませんでした');
        }
    }

})();
