#!/bin/bash
# Complete demonstration of the NYC Temperature + Trees system

echo "================================================================"
echo "NYC Temperature Prediction with Tree Mitigation"
echo "Complete Example Workflow"
echo "================================================================"
echo ""

# Example 1: Add 25 trees to a Manhattan hex
echo "Example 1: Add 25 trees to Times Square area"
echo "------------------------------------------------------------"
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 25 --use_cached_predictions
echo ""

# Example 2: Try different amounts
echo "Example 2: Compare different interventions"
echo "------------------------------------------------------------"
echo "Scenario A: 10 trees"
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 10 --use_cached_predictions --output scenario_10trees.csv
echo ""

echo "Scenario B: 50 trees"
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 50 --use_cached_predictions --output scenario_50trees.csv
echo ""

echo "Scenario C: 100 trees"
python add_trees_cli.py --h3_id 892a10726d7ffff --add_trees 100 --use_cached_predictions --output scenario_100trees.csv
echo ""

# Example 3: Find trees needed for target cooling
echo "Example 3: Reverse calculation - trees needed for 2°C cooling"
echo "------------------------------------------------------------"
python tree_mitigation_cli.py --h3_id 892a10726d7ffff --target_reduction 2.0 --use_cached_predictions
echo ""

echo "================================================================"
echo "Complete! Check the CSV files for detailed results."
echo "================================================================"
