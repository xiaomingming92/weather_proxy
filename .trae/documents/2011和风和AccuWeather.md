一、AccuWeather 2011 年官方天气码范围

2010–2012 年 AccuWeather Android SDK 常用 icon code 范围是：

1 – 54

其中常见定义如下（2011 年版本标准）：

Accu Code	含义
1	Sunny
2	Mostly Sunny
3	Partly Sunny
4	Intermittent Clouds
5	Hazy Sunshine
6	Mostly Cloudy
7	Cloudy
8	Dreary (Overcast)
11	Fog
12	Showers
13	Mostly Cloudy w/ Showers
14	Partly Sunny w/ Showers
15	T-Storms
18	Rain
19	Flurries
21	Partly Sunny w/ Flurries
22	Snow
23	Mostly Cloudy w/ Snow
26	Freezing Rain
29	Rain and Snow
32	Windy
33	Clear (Night)
34	Mostly Clear
35	Partly Cloudy
36	Intermittent Clouds (Night)
38	Mostly Cloudy (Night)
51	Light Rain
52	Light Snow
53	Blowing Snow
54	Ice

你数组里出现的所有值，都在这个范围内。

二、华风 2011 年天气码（推断还原）

根据数组顺序可还原华风原始 0–35 定义：

TABLE_CONDITION_CHINA2ACCU
index = 华风天气码
value = Accu icon
华风码	白天Accu	夜间Accu	推测含义
0	1	33	晴
1	6	38	多云
2	8	8	阴
3	18	18	中雨
4	15	15	雷阵雨
5	51	51	小雨
6	29	29	雨夹雪
7	14	14	阵雨
8	13	13	阴有阵雨
9	18	18	大雨
10	15	15	雷暴
11	22	22	中雪
12	22	22	大雪
13	23	23	阴有雪
14	21	21	阵雪
15	19	19	小雪
16	22	22	暴雪
17	22	22	强降雪
18	11	11	雾
19	26	26	冻雨
20	52	52	小雪
21	13	13	阴阵雨
22	15	15	雷阵雨
23	15	15	强雷阵雨
24	15	15	雷雨
25	15	15	暴雷
26	19	19	小阵雪
27	22	22	中阵雪
28	22	22	大阵雪
29	53	53	风雪
30	52	52	小雪
31	52	52	中雪
32	32	32	大风
33	54	54	冰粒
34	19	19	零星小雪
35	11	11	浓雾