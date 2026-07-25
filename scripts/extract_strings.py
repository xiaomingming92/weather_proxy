#!/usr/bin/env python3
"""
HTC ROM 字符串提取器
从.odex文件中提取可打印字符串常量

使用方法:
    python scripts/extract_strings.py <odex文件路径>
    
示例:
    python scripts/extract_strings.py WORKING_022126_234011/system/app/Weather.odex
"""

import sys
import re


def extract_strings(filepath: str, min_length: int = 4) -> list:
    """
    从二进制文件中提取可打印ASCII字符串
    
    Args:
        filepath: 文件路径
        min_length: 最小字符串长度
    
    Returns:
        字符串列表
    """
    strings = []
    current = b''
    
    try:
        with open(filepath, 'rb') as f:
            while True:
                byte = f.read(1)
                if not byte:
                    break
                
                # 检查是否为可打印ASCII字符（32-126）
                if 32 <= byte[0] <= 126:
                    current += byte
                else:
                    # 遇到不可打印字符，保存当前字符串
                    if len(current) >= min_length:
                        try:
                            strings.append(current.decode('ascii'))
                        except:
                            pass
                    current = b''
    except FileNotFoundError:
        print(f"错误: 文件不存在 - {filepath}")
        sys.exit(1)
    except Exception as e:
        print(f"错误: {e}")
        sys.exit(1)
    
    return strings


def search_weather_related(filepath: str) -> list:
    """
    搜索天气相关的字符串
    
    Args:
        filepath: ROM文件路径
        
    Returns:
        匹配的字符串列表
    """
    strings = extract_strings(filepath)
    
    # 天气相关关键词
    keywords = [
        'weather', 'sunny', 'cloudy', 'rain', 'snow', 'fog',
        'accuweather', 'forecast', 'temp', 'humidity',
        'htc.accuweather.com', 'widget', 'forecast-data',
        'city', 'location', 'search'
    ]
    
    results = []
    for s in strings:
        s_lower = s.lower()
        for kw in keywords:
            if kw in s_lower:
                results.append(s)
                break
    
    return results


def extract_urls(filepath: str) -> list:
    """
    从文件中提取HTTP URL
    
    Args:
        filepath: ROM文件路径
        
    Returns:
        URL列表
    """
    with open(filepath, 'rb') as f:
        data = f.read()
    
    # URL正则表达式模式
    url_pattern = rb'http[s]?://[^\x00-\x20<>"\']+'
    urls = re.findall(url_pattern, data)
    
    # 去重并解码
    unique_urls = set()
    for url in urls:
        try:
            decoded = url.decode('ascii')
            if len(decoded) > 10:
                unique_urls.add(decoded)
        except:
            pass
    
    return sorted(unique_urls)


def main():
    if len(sys.argv) < 2:
        print("用法: python extract_strings.py <odex文件路径>")
        print("示例: python extract_strings.py WORKING_022126_234011/system/app/Weather.odex")
        sys.exit(1)
    
    filepath = sys.argv[1]
    
    print(f"分析文件: {filepath}")
    print("=" * 60)
    
    # 提取URL
    print("\n【1. 提取URL】")
    urls = extract_urls(filepath)
    print(f"找到 {len(urls)} 个URL:")
    for url in urls:
        if 'accuweather' in url.lower():
            print(f"  [AccuWeather] {url}")
        elif 'weather' in url.lower():
            print(f"  [Weather] {url}")
        else:
            print(f"  [Other] {url}")
    
    # 提取天气相关字符串
    print("\n【2. 天气相关字符串】")
    results = search_weather_related(filepath)
    print(f"找到 {len(results)} 个相关字符串 (前50个):")
    for s in results[:50]:
        print(f"  {s}")
    
    print("\n" + "=" * 60)
    print("分析完成!")


if __name__ == '__main__':
    main()
