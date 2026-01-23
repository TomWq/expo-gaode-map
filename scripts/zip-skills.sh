#!/bin/bash

set -e

# 输出目录
OUTPUT_DIR="website/docs/public"
mkdir -p "$OUTPUT_DIR"

echo "📦 开始打包 Skills..."

# 进入 skills 目录
cd skills

# 遍历每个子目录
for skill in */; do
    skill_name=${skill%/} # 去掉末尾的斜杠
    zip_name="${skill_name}.zip"
    
    echo "  - 打包 ${skill_name} -> ${zip_name}"
    
    # 打包该目录下的所有内容到 zip 文件
    # 使用 -r 递归，-j 不包含顶层目录路径（即 zip 根目录下就是 SKILL.md）
    # 或者保留顶层目录？Trae 文档说“上传一个 SKILL.md 文件或一个包含 SKILL.md 文件的 .zip 文件”
    # 通常保留顶层目录比较安全，解压后是一个文件夹。
    # 但如果 Trae 期待直接读取，可能不需要顶层目录。
    # 让我们尝试保留顶层目录结构，即 zip 根目录下是 skill-name/SKILL.md
    
    zip -r -q "../${OUTPUT_DIR}/${zip_name}" "$skill_name" -x "*.DS_Store"
done

echo "✅ 所有 Skills 打包完成！"
echo "📂 文件位于: ${OUTPUT_DIR}"
ls -lh "../${OUTPUT_DIR}"/*.zip
