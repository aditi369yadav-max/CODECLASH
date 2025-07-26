#include <iostream> // Required for input/output operations

int digitSum(int n) {
  int sum = 0;
  // Handle negative numbers by taking the absolute value
  if (n < 0) {
    n = -n; 
  }
  while (n > 0) {
    sum += n % 10; // Add the last digit to the sum
    n /= 10;       // Remove the last digit
  }
  return sum;
}

int main() {
  int number;

  // Prompt the user to enter a number
  std::cout << "Enter an integer: ";
  std::cin >> number; // Read the integer from the user

  // Calculate the sum of digits using the digitSum function
  int sumOfDigits = digitSum(number);

  // Display the result
  std::cout << "The sum of digits of " << number << " is: " << sumOfDigits << std::endl;

  return 0; // Indicate successful execution
}