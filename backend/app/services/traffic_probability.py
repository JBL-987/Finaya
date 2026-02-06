from typing import List

def junction_probability(junction_type: str) -> float:
    if junction_type == "B":      # Turn
        return 0.5
    elif junction_type == "P":    # T-junction
        return 1/3
    elif junction_type == "JK":   # small road
        return 0.4
    else:                         # main road default
        return 0.8


def probabilistic_traffic(initial_traffic: float, junctions: List[str]) -> float:
    prob = 1.0
    for j in junctions:
        prob *= junction_probability(j)

    return initial_traffic * prob
