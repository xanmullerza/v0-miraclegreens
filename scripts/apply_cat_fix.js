
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Categorizing herbs and spices...");
    await supabase.from('food_items').update({ category: 'Flavour' }).or('name.ilike.%sage%,name.ilike.%thyme%,name.ilike.%mustard%,name.ilike.%pepper%,name.ilike.%cinnamon%,name.ilike.%clove%,name.ilike.%coriander%,name.ilike.%cumin%,name.ilike.%nutmeg%,name.ilike.%paprika%,name.ilike.%turmeric%,name.ilike.%ginger%,name.ilike.%basil%,name.ilike.%oregano%,name.ilike.%rosemary%,name.ilike.%vanilla%,name.ilike.%allspice%,name.ilike.%star anise%,name.ilike.%mace%,name.ilike.%cardamom%,name.ilike.%extract%');

    console.log("Categorizing oils...");
    await supabase.from('food_items').update({ category: 'Oils' }).or('name.ilike.%oil%,name.ilike.%lard%,name.ilike.%tallow%,name.ilike.%butter%,name.ilike.%margarine%,name.ilike.%fat%');

    console.log("Categorizing fruits (including olives)...");
    await supabase.from('food_items').update({ category: 'Fruit' }).or('name.ilike.%apple%,name.ilike.%banana%,name.ilike.%orange%,name.ilike.%grape%,name.ilike.%berry%,name.ilike.%berries%,name.ilike.%mango%,name.ilike.%pineapple%,name.ilike.%melon%,name.ilike.%peach%,name.ilike.%pear%,name.ilike.%plum%,name.ilike.%cherry%,name.ilike.%lemon%,name.ilike.%lime%,name.ilike.%kiwi%,name.ilike.%avocado%,name.ilike.%coconut%,name.ilike.%date%,name.ilike.%fig%,name.ilike.%olive%');

    console.log("Categorizing nuts and seeds...");
    await supabase.from('food_items').update({ category: 'Nuts' }).or('name.ilike.%nut%,name.ilike.%seed%,name.ilike.%almond%,name.ilike.%walnut%,name.ilike.%pecan%,name.ilike.%cashew%,name.ilike.%pistachio%,name.ilike.%hazelnut%,name.ilike.%macadamia%,name.ilike.%chia%,name.ilike.%flax%,name.ilike.%hemp%,name.ilike.%sunflower%,name.ilike.%pumpkin%,name.ilike.%sesame%');

    console.log("Done.");
}

runMigration();
