/* =========================================
   templates.js: テンプレートデータの定義
   ========================================= */

// テンプレートの定義
// キー（"math", "cooking"など）が呼び出し用IDになります
const TEMPLATES = {
    "math": [
        {
            name: "図形と方程式",
            items: [
                { name: "内分・外分点", relation: "座標,座標,比→座標" },
                { name: "円の方程式", relation: "中心,半径→方程式" },
                { name: "円の方程式", relation: "通る点3つ→方程式" },
                { name: "直線の方程式", relation: "通る点2つ→方程式" },
                { name: "直線の方程式", relation: "通る点,傾き→方程式" }
            ]
        },
        {
            name: "2次方程式",
            items: [
                { name: "解と係数の関係", relation: "2次式→解同士の和と積" },
                { name: "判別式", relation: "2次式→実数解の個数に関する値" }
            ]
        }
    ],
    "cooking": [
        {
            name: "水を媒介させる",
            items: [
                { name: "煮る", relation: "栄養が水に溶け出しやすい" },
                { name: "蒸す", relation: "蒸し器のセットが大変" }
            ]
        },
        {
            name: "油を媒介させる",
            items: [
                { name: "揚げる", relation: "食材中の水分を飛ばし油と入れ替える" }
            ]
        },
        {
            name: "金属を媒介させる",
             items: [
                { name: "炒める", relation: "焦げないように全体に均等に" },
                { name: "焼く", relation: "表面に重点的に火を入れる" }
             ]
       },
       {
            name: "媒介させない",
             items: [
                { name: "直火", relation: "焼きムラが出る、危ない" },
                { name: "炙る", relation: "表面だけを直火でやる" }
             ]
       }
    ]
};
