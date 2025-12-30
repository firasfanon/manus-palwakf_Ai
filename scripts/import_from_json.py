#!/usr/bin/env python3
"""
سكريبت لإدخال المراجع الأساسية من ملف JSON إلى قاعدة البيانات
"""

import json
import os
import sys
from datetime import datetime
import mysql.connector
from mysql.connector import Error

# قراءة متغير البيئة
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("❌ DATABASE_URL is not defined")
    sys.exit(1)

# استخراج معلومات الاتصال من DATABASE_URL
# Format: mysql://user:password@host:port/database
try:
    url_parts = DATABASE_URL.replace('mysql://', '').split('@')
    user_pass = url_parts[0].split(':')
    host_db = url_parts[1].split('/')
    host_port = host_db[0].split(':')
    
    db_config = {
        'user': user_pass[0],
        'password': user_pass[1],
        'host': host_port[0],
        'port': int(host_port[1]) if len(host_port) > 1 else 3306,
        'database': host_db[1].split('?')[0],  # Remove query parameters
    }
except Exception as e:
    print(f"❌ خطأ في تحليل DATABASE_URL: {e}")
    sys.exit(1)

def add_knowledge_document(cursor, document):
    """إضافة مرجع واحد إلى قاعدة المعرفة"""
    try:
        # تحويل الفئة من العربية إلى الإنجليزية
        category_map = {
            'قانوني': 'law',
            'فقهي': 'jurisprudence',
            'تاريخي': 'historical',
            'مرجع': 'reference',
            'إداري': 'administrative',
            'مجلة الأحكام': 'majalla'
        }
        
        category = category_map.get(document['category'], 'reference')
        
        query = """
        INSERT INTO knowledge_documents 
        (title, content, category, source, tags, createdAt)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        values = (
            document['title'],
            document['content'],
            category,
            document['source'],
            document.get('tags', ''),
            datetime.now()
        )
        
        cursor.execute(query, values)
        print(f"✅ تم إضافة: {document['title']}")
        return True
        
    except Error as e:
        print(f"❌ خطأ في إضافة {document['title']}: {e}")
        return False

def import_documents(cursor, documents):
    """إدخال مجموعة مراجع"""
    print(f"\n📚 بدء إدخال {len(documents)} مرجع...\n")
    
    success_count = 0
    error_count = 0
    
    for doc in documents:
        if add_knowledge_document(cursor, doc):
            success_count += 1
        else:
            error_count += 1
    
    print(f"\n✅ نجح: {success_count}")
    print(f"❌ فشل: {error_count}")
    print(f"📊 الإجمالي: {len(documents)}\n")
    
    return success_count, error_count

def main():
    """الدالة الرئيسية"""
    try:
        print("🚀 بدء عملية إدخال المراجع الأساسية...\n")
        
        # قراءة ملف JSON
        json_file = '/home/ubuntu/waqf_ai_model/scripts/basic_references.json'
        with open(json_file, 'r', encoding='utf-8') as f:
            documents = json.load(f)
        
        print(f"📖 تم قراءة {len(documents)} مرجع من الملف\n")
        
        # الاتصال بقاعدة البيانات
        connection = mysql.connector.connect(**db_config)
        
        if connection.is_connected():
            print("✅ تم الاتصال بقاعدة البيانات\n")
            
            cursor = connection.cursor()
            
            # إدخال المراجع
            success, errors = import_documents(cursor, documents)
            
            # حفظ التغييرات
            connection.commit()
            print("✅ تم حفظ التغييرات في قاعدة البيانات")
            
            cursor.close()
            connection.close()
            
            print("\n✅ اكتملت عملية الإدخال بنجاح!\n")
            
            return 0 if errors == 0 else 1
            
    except Error as e:
        print(f"❌ خطأ في الاتصال بقاعدة البيانات: {e}")
        return 1
    except FileNotFoundError:
        print(f"❌ لم يتم العثور على ملف JSON")
        return 1
    except json.JSONDecodeError as e:
        print(f"❌ خطأ في قراءة ملف JSON: {e}")
        return 1
    except Exception as e:
        print(f"❌ خطأ غير متوقع: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
