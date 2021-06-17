import pandas as pd
from sklearn.cluster import DBSCAN
import sklearn.utils
#from scipy.spatial import ConvexHull

import matplotlib.pyplot as plt
import numpy as np

data = pd.read_csv('../Database/quakes.csv')

len = data.shape[0]
print(f'before filter: {len}')

data = data[data['type'] == 'earthquake']
#remove unnecessary columns
data = data.drop(columns=['magType','nst','gap','dmin','rms','updated','place','type','horizontalError','depthError','magError','magNst','net','status','locationSource','magSource'])

#remove data outside of CA
data = data[(data['latitude'] >= 26) & (data['latitude'] <= 45) &
        (data['longitude'] >= -129) & (data['longitude'] <= -111)]

#maybe exclude mag below 2.5?

len = data.shape[0]
print(f"after filter: {len}")


#select Lat & Lng for clustering
#cdat = data[['latitude','longitude']]

#do clustering
#db = DBSCAN(eps=0.24, min_samples=300).fit(cdat)

#number of cluster
#nCluster = db.labels_.max()
#print(f'{nCluster} clusters')

#data["cluster"] = db.labels_

""" for i in range(nCluster+1):
        #get quakes from cluster
        cquakes = data[data['cluster'] == i]
        qarr = cquakes[['Latitude', 'Longitude']]#.values
        defpoints = qarr.values

        hull = ConvexHull(qarr)

        plt.plot(qarr.Longitude,qarr.Latitude, 'o')
        for simplex in hull.simplices:
            #Draw a black line between each
                plt.plot( defpoints[simplex, 1],defpoints[simplex, 0], 'k-')


#plot cluster to confirm
data.plot.scatter(x='Longitude',y='Latitude',c='cluster',colormap='viridis')
plt.show()
 """

data.to_csv('../Database/equakes_processed.csv', index=False)