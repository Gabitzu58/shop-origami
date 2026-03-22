function salut() {
    document.writeln("Salut")
    document.writeln('<button onclick="window.location.href=\'index.html\'">Inapoi</button>');

    for(let i = 1; i <= 5; ++i )
        document.writeln("Numarul meue este: " + i);
}