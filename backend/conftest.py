import os
import sys

# The app imports as `from models.base import ...`, i.e. it assumes the backend
# directory is on the path. Put it there so tests can be run from anywhere.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
