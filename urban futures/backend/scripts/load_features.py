#!/usr/bin/env python3
import sys
import os

# Change directory first to avoid numpy import issues
os.chdir('/tmp')

import pandas as pd
import json

features_path = sys.argv[1] if len(sys.argv) > 1 else 'data/models/zip_features.parquet'

if os.path.exists(features_path):
    df = pd.read_parquet(features_path)
    result = df.to_dict('records')
    print(json.dumps(result))
else:
    print(json.dumps([]))

