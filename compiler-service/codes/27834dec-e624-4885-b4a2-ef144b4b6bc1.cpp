#include <iostream>
#include <string>

class Solution {
public:
    bool isPalindrome(int x) {
        if (x < 0) {
            return false;
        }

        if (x % 10 == 0 && x != 0) {
            return false;
        }

        int reversedNumber = 0;

        while (x > reversedNumber) {
            int digit = x % 10;
            reversedNumber = reversedNumber * 10 + digit;
            x /= 10;
        }

        return x == reversedNumber || x == reversedNumber / 10;
    }
};

int main() {
    Solution sol;

    std::cout << "Is 121 a palindrome? " << (sol.isPalindrome(121) ? "True" : "False") << std::endl;
    std::cout << "Is -121 a palindrome? " << (sol.isPalindrome(-121) ? "True" : "False") << std::endl;
    std::cout << "Is 10 a palindrome? " << (sol.isPalindrome(10) ? "True" : "False") << std::endl;
    std::cout << "Is 0 a palindrome? " << (sol.isPalindrome(0) ? "True" : "False") << std::endl;
    std::cout << "Is 1234321 a palindrome? " << (sol.isPalindrome(1234321) ? "True" : "False") << std::endl;
    std::cout << "Is 12345 a palindrome? " << (sol.isPalindrome(12345) ? "True" : "False") << std::endl;
    std::cout << "Is 1221 a palindrome? " << (sol.isPalindrome(1221) ? "True" : "False") << std::endl;

    return 0;
}