using Exercises.Week01;

namespace Exercises.Tests.Week01;

public class PalindromeTests
{
    [Fact] public void Classic_sentence_is_palindrome() => Assert.True(Palindrome.IsPalindrome("A man, a plan, a canal: Panama"));
    [Fact] public void Not_palindrome() => Assert.False(Palindrome.IsPalindrome("race a car"));
    [Fact] public void Empty_is_palindrome() => Assert.True(Palindrome.IsPalindrome(""));
    [Fact] public void Digits_count() => Assert.False(Palindrome.IsPalindrome("0P"));
}
