import os
from dotenv import load_dotenv
load_dotenv('.env')

from pymongo import MongoClient
c = MongoClient(os.environ['MONGODB_URI'])
d = c.get_default_database()

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from core import model as m_mod
from core.explainer import build_explainer, explain
from schemas import ApplicantInput

m = m_mod.load_model()
enc = m_mod.get_encoders()
feat = m_mod.get_feature_names()
build_explainer(m)

apps = list(d['applications'].find({}))
count = 0

for doc in apps:
    f_imp_db = doc.get("prediction", {}).get("feature_importance", {})
    if f_imp_db.get("age", 0) == 0.0:
        try:
            inp_dict = doc["input"]
            inp = ApplicantInput(**inp_dict)
            arr = m_mod.preprocess(inp, enc, feat)
            new_f_imp, new_expl = explain(arr, feat, inp)
            
            if new_f_imp and new_f_imp.get("age", 0.0) != 0.0:
                d['applications'].update_one(
                    {'_id': doc['_id']},
                    {'$set': {
                        'prediction.feature_importance': new_f_imp,
                        'prediction.explanations': new_expl
                    }}
                )
                count += 1
        except Exception as e:
            print(f"Error updating doc {doc['_id']}: {e}")

print('Updated records:', count)
