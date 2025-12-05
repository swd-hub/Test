// ==UserScript==
// @name         農地マップ全国自動化
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  全国47都道府県の遊休農地情報を自動取得
// @author       You
// @match        https://map.maff.go.jp/*
// @grant        GM_setClipboard
// @grant        GM_notification
// @grant        GM_download
// ==/UserScript==

(function() {
    'use strict';

    // 全都道府県リスト
    const prefectures = [
        '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
        '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
        '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
        '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
        '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
        '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
        '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
    ];

    const results = {}; // 結果格納用
    let currentIndex = 0; // 現在の都道府県インデックス

    // 自動実行開始
    window.addEventListener('load', function() {
        setTimeout(startCollecting, 2000);
    });

    function startCollecting() {
        console.log('全国データ収集を開始します');
        GM_notification({
            title: '農地マップ全国自動化',
            text: '全47都道府県のデータ収集を開始します',
            timeout: 3000
        });
        processNextPrefecture();
    }

    function processNextPrefecture() {
        if (currentIndex >= prefectures.length) {
            // すべての都道府県が完了
            console.log('すべてのデータ収集が完了しました');
            generateCSV();
            return;
        }

        const prefecture = prefectures[currentIndex];
        console.log(`処理中: ${prefecture} (${currentIndex + 1}/${prefectures.length})`);

        // 都道府県を選択
        selectPrefecture(prefecture);
    }

    function selectPrefecture(prefectureName) {
        // 都道府県ドロップダウンを探す
        const selects = document.querySelectorAll('select');
        let found = false;

        selects.forEach(select => {
            const options = select.querySelectorAll('option');
            options.forEach(option => {
                if (option.textContent.includes(prefectureName)) {
                    select.value = option.value;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    found = true;
                    console.log(`${prefectureName} を選択しました`);
                }
            });
        });

        if (found) {
            setTimeout(selectCategories, 1000);
        } else {
            console.log(`${prefectureName} が見つかりませんでした`);
            currentIndex++;
            setTimeout(processNextPrefecture, 1000);
        }
    }

    function selectCategories() {
        // ラジオボタン選択（3種類すべて）
        const labels = document.querySelectorAll('label');
        let found = false;

        labels.forEach(label => {
            const text = label.textContent.trim();
            
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
            console.log('カテゴリを選択しました');
            setTimeout(submitForm, 500);
        } else {
            console.log('カテゴリが見つかりませんでした');
            currentIndex++;
            setTimeout(processNextPrefecture, 1000);
        }
    }

    function submitForm() {
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
            setTimeout(extractAndSave, 3000);
        } else {
            currentIndex++;
            setTimeout(processNextPrefecture, 1000);
        }
    }

    function extractAndSave() {
        const pageText = document.body.innerText;
        const match = pageText.match(/現在[\s　]*([0-9,]+)\s*件/);
        
        const prefecture = prefectures[currentIndex];
        
        if (match && match[1]) {
            const count = match[1].replace(/,/g, '');
            results[prefecture] = count;
            console.log(`${prefecture}: ${count} 件`);
            
            GM_notification({
                title: '農地マップ全国自動化',
                text: `${prefecture}: ${count} 件`,
                timeout: 2000
            });
        } else {
            results[prefecture] = '取得失敗';
            console.log(`${prefecture}: データ取得失敗`);
        }

        currentIndex++;
        setTimeout(processNextPrefecture, 1000);
    }

    function generateCSV() {
        // CSV形式で生成
        let csv = '都道府県,遊休農地件数\n';

        prefectures.forEach(prefecture => {
            const count = results[prefecture] || '未取得';
            csv += `${prefecture},${count}\n`;
        });

        console.log('CSV生成完了：');
        console.log(csv);

        // ファイルダウンロード
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `農地データ_全国_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        GM_notification({
            title: '農地マップ全国自動化',
            text: 'CSVファイルをダウンロードしました！',
            timeout: 5000
        });

        // コンソールにも出力
        console.log('========== 収集結果 ==========');
        console.log(csv);
        console.log('==============================');
    }
})();
