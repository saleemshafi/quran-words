<?php

// connect
$m = new Mongo();
$db = $m->quran;

$roots = $db->command(array("distinct" => "tokens", "key" => "root_tr", "query" => array("root_tr" => array('$ne' => NULL))));

$root_values = $roots['values']; 
sort($root_values);

foreach ($root_values as $root) {
    echo "<li>$root</li>";
}
