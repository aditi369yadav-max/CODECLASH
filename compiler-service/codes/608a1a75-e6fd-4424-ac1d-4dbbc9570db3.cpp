#include <vector>   // Required for std::vector
#include <stack>    // Required for std::stack
#include <iostream> // Required for std::cout and std::endl

class Solution {
public:
    std::vector<int> dailyTemperatures(std::vector<int>& temperatures) {
        int n = temperatures.size();
        std::vector<int> answer(n, 0);
        std::stack<int> s;

        for (int i = 0; i < n; ++i) {
            while (!s.empty() && temperatures[i] > temperatures[s.top()]) {
                int prev_index = s.top();
                s.pop();
                answer[prev_index] = i - prev_index;
            }
            s.push(i);
        }

        return answer;
    }
}; // This semicolon is crucial after a class definition

int main() {
    Solution sol;

    std::vector<int> temperatures1 = {73, 74, 75, 71, 69, 72, 76, 73};
    std::vector<int> result1 = sol.dailyTemperatures(temperatures1);
    std::cout << "Temperatures: [";
    for (int i = 0; i < temperatures1.size(); ++i) {
        std::cout << temperatures1[i] << (i == temperatures1.size() - 1 ? "" : ", ");
    }
    std::cout << "] -> Result: [";
    for (int i = 0; i < result1.size(); ++i) {
        std::cout << result1[i] << (i == result1.size() - 1 ? "" : ", ");
    }
    std::cout << "]" << std::endl;

    std::vector<int> temperatures2 = {30, 40, 50, 60};
    std::vector<int> result2 = sol.dailyTemperatures(temperatures2);
    std::cout << "Temperatures: [";
    for (int i = 0; i < temperatures2.size(); ++i) {
        std::cout << temperatures2[i] << (i == temperatures2.size() - 1 ? "" : ", ");
    }
    std::cout << "] -> Result: [";
    for (int i = 0; i < result2.size(); ++i) {
        std::cout << result2[i] << (i == result2.size() - 1 ? "" : ", ");
    }
    std::cout << "]" << std::endl;

    std::vector<int> temperatures3 = {30, 60, 90};
    std::vector<int> result3 = sol.dailyTemperatures(temperatures3);
    std::cout << "Temperatures: [";
    for (int i = 0; i < temperatures3.size(); ++i) {
        std::cout << temperatures3[i] << (i == temperatures3.size() - 1 ? "" : ", ");
    }
    std::cout << "] -> Result: [";
    for (int i = 0; i < result3.size(); ++i) {
        std::cout << result3[i] << (i == result3.size() - 1 ? "" : ", ");
    }
    std::cout << "]" << std::endl;

    return 0;
}