using Exercises.Week01;

namespace Exercises.Tests.Week01;

public class ReverseWordsTests
{
    [Fact] public void Reverses_two_words() => Assert.Equal("world hello", ReverseWords.Reverse("hello world"));
    [Fact] public void Removes_extra_spaces() => Assert.Equal(".NET love I", ReverseWords.Reverse("  I   love .NET "));
    [Fact] public void Whitespace_returns_empty() => Assert.Equal("", ReverseWords.Reverse("   "));
    [Fact] public void Single_word_unchanged() => Assert.Equal("Dublin", ReverseWords.Reverse("Dublin"));
}
