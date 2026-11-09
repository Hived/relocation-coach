namespace Exercises.Week02;

public abstract class Shape
{
    public abstract double Area();

    public virtual string Describe()
    {
        // TODO
        throw new NotImplementedException();
    }
}

// TODO: Circle, Rectangle, Square (Square : Rectangle)
public class Circle : Shape
{
    public Circle(double radius) { throw new NotImplementedException(); }
    public override double Area() => throw new NotImplementedException();
}

public class Rectangle : Shape
{
    public Rectangle(double width, double height) { throw new NotImplementedException(); }
    public override double Area() => throw new NotImplementedException();
}

public class Square : Rectangle
{
    public Square(double side) : base(side, side) { }
}

public static class ShapeTools
{
    public static double TotalArea(IEnumerable<Shape> shapes)
    {
        // TODO
        throw new NotImplementedException();
    }
}
