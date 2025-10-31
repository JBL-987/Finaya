# Import all schemas by module
from .common import *
from .user import *
from .auth import *
from .analysis import *
from .accounting import *
from .advisor import *
from .document import *

# For backward compatibility and convenience, also import from old location
from .schemas import *
